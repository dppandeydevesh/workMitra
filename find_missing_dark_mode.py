import os
import re

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    classnames = re.findall(r'className=["\']([^"\']+)["\']|className=\{`([^`]+)`\}', content)
    
    issues = []
    
    for match in classnames:
        cls_str = match[0] if match[0] else match[1]
        
        # Split into individual classes
        classes = cls_str.split()
        
        has_light_bg = any(c.startswith('bg-gray-') or c == 'bg-white' or c.startswith('bg-blue-') or c.startswith('bg-purple-') for c in classes)
        has_dark_bg = any(c.startswith('dark:bg-') for c in classes)
        
        has_light_text = any(c.startswith('text-gray-') or c.startswith('text-slate-') or c == 'text-black' for c in classes)
        has_dark_text = any(c.startswith('dark:text-') for c in classes)
        
        has_light_border = any(c.startswith('border-gray-') or c.startswith('border-slate-') or c.startswith('border-blue-') for c in classes)
        has_dark_border = any(c.startswith('dark:border-') for c in classes)
        
        if has_light_bg and not has_dark_bg:
            if 'bg-white' in classes and 'bg-opacity' not in cls_str:
                issues.append(f"Missing dark:bg- on: {' '.join(classes)[:40]}")
            elif any(c in ['bg-gray-50', 'bg-gray-100', 'bg-gray-200'] for c in classes):
                issues.append(f"Missing dark:bg- on: {' '.join(classes)[:40]}")
                
        if has_light_text and not has_dark_text:
            if any(c in ['text-gray-700', 'text-gray-800', 'text-gray-900', 'text-black'] for c in classes):
                issues.append(f"Missing dark:text- on: {' '.join(classes)[:40]}")
                
        if has_light_border and not has_dark_border:
            if any(c in ['border-gray-200', 'border-gray-300'] for c in classes):
                issues.append(f"Missing dark:border- on: {' '.join(classes)[:40]}")

    if issues:
        print(f"--- {filepath} ---")
        for i in issues:
            print(f"  - {i}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.jsx'):
            check_file(os.path.join(root, f))
