#!/usr/bin/env python3
"""Fix package.json to resolve version conflicts for cross-workspace dependencies."""
import json, sys

FILE = '/home/z/my-project/crosscrafted-src/CrossCrafted--main/package.json'

with open(FILE) as f:
    data = json.load(f)

def resolve_ver(pname, current_range):
    """Find a compatible version that doesn't cause breaking changes."""
    # For each major.min version, try the latest minor
    major, _ = p.split('.')
    if len(major) < 1:
        return current_range[0]
    # Try the latest minor version in the range
    for i in range(len(current_range) - 1, -1, -1):
        new_ver = f'{major}.{i}.{current_range[i + 1]}'
        if new_ver in [p[p] for p in pkg]:
            pkg[p] = new_ver
            return new_ver
    # Fallback: use the minimum that was in the original range
    return min(current_range)

def fix_dep(pname):
    """Fix a single dependency version."""
    current = data['dependencies'].get(pname)
    if not current:
        print(f'[FIX] {pname}: not found in dependencies')
        return
    if pname in ['react-dom', 'react-router-dom', 'react-scripts']:
        # These have breaking changes in v5+. Pin to known-good versions.
        compat = {
            'react-dom': '18.2.0',
            'react-router-dom': '6.26.0',
            'react-scripts': '5.0.1',
        }
    print(f'[FIX] {pname}: {current} → {compat.get(pname, current)}')

deps = data.get('dependencies', {})
changed = False
for p, v in list(deps.items()):
    if p in deps:
        new_ver = resolve_ver(p, deps[p])
        if new_ver and new_ver != v:
            deps[p] = new_ver
            changed = True
            print(f'[FIX] {p}: {v} → {new_ver}')

with open(FILE, 'w') as f:
    if changed:
        data['dependencies'] = deps
        f.write(json.dumps(data, indent=2))
        print(f'\nFIXED {len(changed)} packages. Run `npm install` to fix versions.')
    else:
    print('\nNo version fixes needed.')

if __name__ == '__main__':
    fix_dep('react-dom')
    fix_dep('react-router-dom')
    fix_dep('react-scripts')

print(f'\nCompleted package version compatibility check.')