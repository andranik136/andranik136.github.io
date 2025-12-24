
import re
import os

# Base paths
base_dir = '/Users/andranikshirinian/Documents/GitHub/andranik136.github.io'
index_path = os.path.join(base_dir, 'index.html')

def get_portfolio_data():
    with open(index_path, 'r') as f:
        content = f.read()
    
    match = re.search(r'const portfolioItems = ref\(\[(.*?)\]\);', content, re.DOTALL)
    if not match:
        print("Could not find portfolioItems in index.html")
        return []
    
    items_str = match.group(1)
    
    items = []
    item_matches = re.finditer(r'\{([^{}]*)\}', items_str, re.DOTALL)
    
    for m in item_matches:
        block = m.group(1)
        if "'3D Art'" in block or '"3D Art"' in block:
            link_match = re.search(r'link:\s*[\'"](.*?)[\'"]', block)
            image_match = re.search(r'image:\s*[\'"](.*?)[\'"]', block)
            
            if link_match and image_match:
                items.append({
                    'link': link_match.group(1),
                    'image': image_match.group(1)
                })
    return items

def update_project_file(item):
    rel_path = item['link'].strip('/')
    project_index_path = os.path.join(base_dir, rel_path, 'index.html')
    
    if not os.path.exists(project_index_path):
        print(f"File not found: {project_index_path}")
        return

    print(f"Updating {project_index_path}...")
    
    with open(project_index_path, 'r') as f:
        content = f.read()
        
    # Calculate relative path to root
    # rel_path is like projects/3d-art/slurm-can
    # depth is 3 means we need ../../../
    depth = len(rel_path.split('/'))
    # Ensure we are not counting empty strings if any
    
    relative_prefix = "../" * depth
    
    # fix image path
    image_path = item["image"]
    if image_path.startswith('/'):
        image_path = image_path[1:]
    
    final_image_path = relative_prefix + image_path
    
    # 1. Update background image style with relative path
    # Replace the body tag again
    
    # Check if we already have the style with absolute path
    if 'style="background-image' in content:
         # regex to replace the url content
         content = re.sub(r'background-image: url\([\'"].*?[\'"]\)', f"background-image: url('{final_image_path}')", content)
    else:
         content = re.sub(r'<body>', f'<body style="background-image: url(\'{final_image_path}\')">', content)

    # 2. Fix CSS link if absolute
    # <link href="/page-style.css" rel="stylesheet"> -> <link href="../../../page-style.css" rel="stylesheet">
    if 'href="/page-style.css"' in content:
        content = content.replace('href="/page-style.css"', f'href="{relative_prefix}page-style.css"')
        
    # Also fix JS if absolute
    if 'src="/js/project-background.js"' in content:
         content = content.replace('src="/js/project-background.js"', '')

    # 3. Save
    with open(project_index_path, 'w') as f:
        f.write(content)

def main():
    items = get_portfolio_data()
    print(f"Found {len(items)} 3D Art items. Updating paths to relative...")
    for item in items:
        update_project_file(item)
    print("Done.")

if __name__ == "__main__":
    main()
