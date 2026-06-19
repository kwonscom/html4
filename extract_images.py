import fitz
import os

pdf_path = 'BAtech_pump_product_summary.pdf'
out_dir = 'pump_images'

os.makedirs(out_dir, exist_ok=True)
doc = fitz.open(pdf_path)

img_idx = 1
for i in range(len(doc)):
    page = doc.load_page(i)
    image_list = page.get_images(full=True)
    for img in image_list:
        xref = img[0]
        pix = fitz.Pixmap(doc, xref)
        
        # Save only valid images
        if pix.width > 100 and pix.height > 100:
            if pix.n - pix.alpha < 4:
                pix.save(f"{out_dir}/pump_{img_idx}.png")
            else:
                pix1 = fitz.Pixmap(fitz.csRGB, pix)
                pix1.save(f"{out_dir}/pump_{img_idx}.png")
                pix1 = None
            img_idx += 1
        pix = None
print(f"Extracted {img_idx-1} images to {out_dir}/")
