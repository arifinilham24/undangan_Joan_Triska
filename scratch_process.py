import os
import re

source = r'C:\laragon\www\undangan4_temp.html'
dest_dir = r'C:\laragon\www\undangan4'

with open(source, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix relative URLs
html = re.sub(r'href=\"/(?!/)', 'href=\"https://nkundangan.com/', html)
html = re.sub(r'src=\"/(?!/)', 'src=\"https://nkundangan.com/', html)
html = re.sub(r'url\(([\'\"]?)/(?!/)', r'url(\g<1>https://nkundangan.com/', html)

# Re-extract app.js correctly (find script with actual logic)
scripts = re.findall(r'<script>(.*?)</script>', html, flags=re.DOTALL)
app_js_content = ''
for s in scripts:
    # Look for substantial JS logic
    if ('function' in s or 'let ' in s or 'const ' in s or '$' in s or 'document' in s) and len(s.strip()) > 20:
        app_js_content += s + '\n\n'
        html = html.replace('<script>' + s + '</script>', '')

if app_js_content:
    html = html.replace('</body>', '<script src=\"app.js\"></script>\n</body>')
    with open(os.path.join(dest_dir, 'app.js'), 'w', encoding='utf-8') as f:
        f.write(app_js_content)

# Re-extract style.css correctly
styles = re.findall(r'<style>(.*?)</style>', html, flags=re.DOTALL)
style_content = ''
if styles:
    style_content = '\n'.join(styles)
    for s in styles:
        html = html.replace('<style>' + s + '</style>', '')
    html = html.replace('</head>', '<link rel=\"stylesheet\" href=\"style.css\">\n</head>')

with open(os.path.join(dest_dir, 'style.css'), 'w', encoding='utf-8') as f:
    f.write(style_content)

with open(os.path.join(dest_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('Done')
