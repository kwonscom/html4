import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the logo in the header
    old_logo_1 = """            <!-- Logo -->
            <a href="index.html" class="logo">
                <div class="logo-icon">
                    <i data-lucide="droplets"></i>
                </div>
                <div class="logo-text">
                    <span class="logo-title">(주)비에이텍</span>
                    <span class="logo-sub">B-ATEC Engineering</span>
                </div>
            </a>"""
    
    new_logo = """            <!-- Logo -->
            <a href="index.html" class="logo" style="display: flex; align-items: center; gap: 10px;">
                <img src="./batec_logo-removebg-preview.png" alt="(주)비에이텍 로고" style="height: 36px; width: auto; object-fit: contain;">
                <div class="logo-text">
                    <span class="logo-title" style="font-weight: 800; color: var(--primary);">(주)비에이텍</span>
                    <span class="logo-sub" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">B-ATEC Engineering</span>
                </div>
            </a>"""
            
    content = content.replace(old_logo_1, new_logo)
    
    # 2. Add Google Map right above Footer
    map_html = """    <!-- Google Map Section -->
    <section class="map-section" style="width: 100%; height: 350px; border-top: 1px solid var(--border-color);">
        <iframe src="https://maps.google.com/maps?q=강원특별자치도%20춘천시%20퇴계공단2길%2064&t=&z=15&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0; filter: grayscale(20%);" allowfullscreen="" loading="lazy"></iframe>
    </section>

    <!-- Footer -->"""
    
    if map_html not in content:
        # Check if <!-- Footer --> exists and replace the first occurrence
        if "    <!-- Footer -->" in content:
            # We replace only if it doesn't already have the map section right before it
            content = content.replace("    <!-- Footer -->", map_html, 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
html_files = glob.glob('*.html')
for file in html_files:
    process_file(file)

print("Done processing files.")
