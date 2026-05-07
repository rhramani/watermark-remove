import cv2
import numpy as np
import sys
import os

def remove_watermark(input_path, output_path):
    if not os.path.exists(input_path):
        sys.exit(1)

    img = cv2.imread(input_path)
    if img is None:
        sys.exit(1)

    height, width = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ─────────────────────────────────────────────────────────────────
    # STEP 1 – MULTI-SCALE LOCAL CONTRAST ANALYSIS
    # Detects both bright text on dark backgrounds and vice-versa
    # ─────────────────────────────────────────────────────────────────
    # Background estimation via large blur
    bg = cv2.GaussianBlur(gray, (75, 75), 0)
    
    # Calculate local deviation (contrast)
    diff = cv2.absdiff(gray, bg)
    
    # Thresholding to find "outlier" pixels (potential text/logos)
    _, mask1 = cv2.threshold(diff, 15, 255, cv2.THRESH_BINARY)
    
    # Adaptive thresholding to catch DARK text on LIGHT backgrounds
    mask_dark = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 25, 5)
    
    # Adaptive thresholding to catch LIGHT text on DARK backgrounds
    mask_light = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                      cv2.THRESH_BINARY, 25, 5)
    
    # Combine masks to catch both types of text
    potential_text = cv2.bitwise_or(mask_dark, mask_light)
    
    # Refine with local contrast (must be an outlier from background)
    combined_mask = cv2.bitwise_and(mask1, potential_text)

    # ─────────────────────────────────────────────────────────────────
    # STEP 2 – FILTER BY GEOMETRIC STROKE PROPERTIES
    # Watermarks usually consist of text or lines (high aspect ratio)
    # ─────────────────────────────────────────────────────────────────
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(combined_mask, connectivity=8)
    clean_mask = np.zeros_like(combined_mask)
    
    # Image area for reference
    img_area = float(height * width)

    for label in range(1, num_labels):
        area = stats[label, cv2.CC_STAT_AREA]
        w = stats[label, cv2.CC_STAT_WIDTH]
        h = stats[label, cv2.CC_STAT_HEIGHT]
        
        # Filter out noise and too-large objects (like the whole lens)
        if area < 4 or area > (img_area * 0.05):
            continue
            
        aspect = w / float(h) if h > 0 else 0
        fill_ratio = area / float(w * h) if (w * h) > 0 else 0
        
        # Text characters usually have specific density and aspect ratios
        is_stroke = (0.05 < fill_ratio < 0.85) and (0.1 < aspect < 10.0)
        
        if is_stroke:
            clean_mask[labels == label] = 255

    # ─────────────────────────────────────────────────────────────────
    # STEP 3 – DYNAMIC GROUPING & REGION FILLING
    # Merges scattered letters into cohesive words/logos
    # ─────────────────────────────────────────────────────────────────
    # Close small gaps between letters
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    grouped = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel_close)
    
    # Find components in the grouped mask
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(grouped, connectivity=8)
    final_removal_mask = np.zeros_like(clean_mask)
    
    for label in range(1, num_labels):
        area = stats[label, cv2.CC_STAT_AREA]
        w = stats[label, cv2.CC_STAT_WIDTH]
        h = stats[label, cv2.CC_STAT_HEIGHT]
        
        # Final sanity check: watermarks are usually compact or horizontal
        if area > 10 and w < (width * 0.4) and h < (height * 0.4):
            # Add the original strokes within this box to the final mask
            x, y = stats[label, cv2.CC_STAT_LEFT], stats[label, cv2.CC_STAT_TOP]
            final_removal_mask[y:y+h, x:x+w] = cv2.bitwise_or(
                final_removal_mask[y:y+h, x:x+w],
                clean_mask[y:y+h, x:x+w]
            )

    # ─────────────────────────────────────────────────────────────────
    # STEP 4 – SMART DILATION & INPAINTING
    # ─────────────────────────────────────────────────────────────────
    # Reduced dilation to prevent smudging (3x3 instead of 7x7)
    dilated_mask = cv2.dilate(final_removal_mask, np.ones((3, 3), np.uint8), iterations=1)
    
    # Use smaller inpaint radius for sharper details
    result = cv2.inpaint(img, dilated_mask, 3, cv2.INPAINT_TELEA)
    
    cv2.imwrite(output_path, result)
    
    # Debug info
    print(f"Success: Removed potential watermark areas.")

if __name__ == "__main__":
    if len(sys.argv) == 3:
        remove_watermark(sys.argv[1], sys.argv[2])
    else:
        sys.exit(1)
