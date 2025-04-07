#!/usr/bin/env python3
import os
import sys
import shutil
import json
import re
from pathlib import Path

def create_directory_structure(project_path):
    """Create the ZuZu project directory structure."""
    # Main folders
    folders = [
        "",  # Root folder
        "public",
        "src",
        "src/components",
        "src/pages",
        "src/services",
        "src/hooks",
        "src/store",
        "src/store/slices",
        "src/types",
        "src/styles",
        "server",
        "server/routes",
        "server/controllers",
        "cypress",
        "cypress/e2e",
        "cypress/fixtures",
        "cypress/support"
    ]
    
    created_dirs = []
    
    for folder in folders:
        folder_path = os.path.join(project_path, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            created_dirs.append(folder_path)
    
    return created_dirs

def get_file_mapping():
    """Define the mapping of file names to their paths in the project."""
    return {
        # Root files
        "package.json.txt": "package.json",
        "package-json.txt": "package.json",
        "tsconfig.json.txt": "tsconfig.json",
        "tsconfig-json.txt": "tsconfig.json",
        "webpack.config.js.txt": "webpack.config.js",
        "webpack-config.js.txt": "webpack.config.js",
        "webpack-config.txt": "webpack.config.js",
        "tailwind.config.js.txt": "tailwind.config.js",
        "tailwind-config.js.txt": "tailwind.config.js",
        "tailwind-config.txt": "tailwind.config.js",
        "cypress.config.ts.txt": "cypress.config.ts",
        "cypress-config.ts.txt": "cypress.config.ts",
        "cypress-config.txt": "cypress.config.ts",
        ".gitignore.txt": ".gitignore",
        "gitignore.txt": ".gitignore",
        "README.md.txt": "README.md",
        "readme.txt": "README.md",
        "readme.md.txt": "README.md",
        
        # Public folder
        "public/index.html.txt": "public/index.html",
        "index-html.txt": "public/index.html",
        "public/favicon.ico.txt": "public/favicon.ico",
        "favicon.ico.txt": "public/favicon.ico",
        "favicon.txt": "public/favicon.ico",
        "favicon.svg": "public/favicon.ico",
        
        # Src folder
        "src/index.tsx.txt": "src/index.tsx",
        "index-tsx.txt": "src/index.tsx",
        "src/App.tsx.txt": "src/App.tsx",
        "app-tsx.txt": "src/App.tsx",
        
        # Components
        "src/components/Header.tsx.txt": "src/components/Header.tsx",
        "header-component.txt": "src/components/Header.tsx",
        "src/components/Footer.tsx.txt": "src/components/Footer.tsx",
        "footer-component.txt": "src/components/Footer.tsx",
        
        # Pages
        "src/pages/Home.tsx.txt": "src/pages/Home.tsx",
        "home-page.txt": "src/pages/Home.tsx",
        "src/pages/About.tsx.txt": "src/pages/About.tsx",
        "about-page.txt": "src/pages/About.tsx",
        "src/pages/Dashboard.tsx.txt": "src/pages/Dashboard.tsx",
        "dashboard-page.txt": "src/pages/Dashboard.tsx",
        
        # Services
        "src/services/api.ts.txt": "src/services/api.ts",
        "api-service.txt": "src/services/api.ts",
        "src/services/supabase.ts.txt": "src/services/supabase.ts",
        "supabase-service.txt": "src/services/supabase.ts",
        
        # Hooks
        "src/hooks/useQuery.ts.txt": "src/hooks/useQuery.ts",
        "query-hook.txt": "src/hooks/useQuery.ts",
        
        # Store
        "src/store/index.ts.txt": "src/store/index.ts",
        "redux-store.txt": "src/store/index.ts",
        "src/store/slices/authSlice.ts.txt": "src/store/slices/authSlice.ts",
        "auth-slice.txt": "src/store/slices/authSlice.ts",
        "src/store/slices/uiSlice.ts.txt": "src/store/slices/uiSlice.ts",
        "ui-slice.txt": "src/store/slices/uiSlice.ts",
        
        # Types
        "src/types/index.ts.txt": "src/types/index.ts",
        "index-types.txt": "src/types/index.ts",
        
        # Styles
        "src/styles/globals.css.txt": "src/styles/globals.css",
        "globals-css.txt": "src/styles/globals.css",
        
        # Server
        "server/index.ts.txt": "server/index.ts",
        "server-index.txt": "server/index.ts",
        "server/routes/api.ts.txt": "server/routes/api.ts",
        "server-routes.txt": "server/routes/api.ts",
        
        # Cypress
        "cypress/e2e/home.cy.ts.txt": "cypress/e2e/home.cy.ts",
        "cypress-test.txt": "cypress/e2e/home.cy.ts",
        "cypress/support/commands.ts.txt": "cypress/support/commands.ts",
        "cypress-commands.txt": "cypress/support/commands.ts",
        "cypress/support/e2e.ts.txt": "cypress/support/e2e.ts",
        "cypress-e2e.txt": "cypress/support/e2e.ts",
        
        # Cypress fixtures - Create a basic empty fixture
        "cypress/fixtures/example.json.txt": "cypress/fixtures/example.json",
    }

def find_similar_files(download_path, target_filename):
    """Find files with similar names to the target filename in the download path."""
    download_files = os.listdir(download_path)
    
    # Look for exact match first
    if target_filename in download_files:
        return os.path.join(download_path, target_filename)
    
    # Try common variations
    base_name = target_filename.replace(".txt", "")
    for file in download_files:
        # Check for files that contain the base name
        if base_name.lower() in file.lower():
            return os.path.join(download_path, file)
    
    return None

def copy_files(download_path, project_path, file_mapping):
    """Copy files from download path to project path according to the mapping."""
    copied_files = []
    missing_files = []
    
    for source_file, dest_path in file_mapping.items():
        # Find the file in download path (handle different naming conventions)
        file_path = find_similar_files(download_path, source_file)
        
        if file_path and os.path.exists(file_path):
            full_dest_path = os.path.join(project_path, dest_path)
            
            # Create parent directories if they don't exist
            os.makedirs(os.path.dirname(full_dest_path), exist_ok=True)
            
            # Copy the file
            shutil.copy2(file_path, full_dest_path)
            copied_files.append(f"{source_file} -> {dest_path}")
        else:
            # Check if using simplified names helps
            simplified_filename = os.path.basename(source_file).replace(".txt", "")
            file_path = find_similar_files(download_path, simplified_filename)
            
            if file_path and os.path.exists(file_path):
                full_dest_path = os.path.join(project_path, dest_path)
                os.makedirs(os.path.dirname(full_dest_path), exist_ok=True)
                shutil.copy2(file_path, full_dest_path)
                copied_files.append(f"{simplified_filename} -> {dest_path}")
            else:
                missing_files.append(dest_path)
    
    return copied_files, missing_files

def create_empty_files(project_path, missing_files):
    """Create empty placeholder files for any missing files."""
    created_empty_files = []
    
    for file_path in missing_files:
        full_path = os.path.join(project_path, file_path)
        
        # Create parent directories if they don't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Create empty file or add minimal content based on file extension
        with open(full_path, 'w') as f:
            if file_path.endswith('.json'):
                f.write('{}')
            elif file_path.endswith('.js') or file_path.endswith('.ts') or file_path.endswith('.tsx'):
                f.write('// Placeholder file')
            elif file_path.endswith('.css'):
                f.write('/* Placeholder CSS */')
            elif file_path.endswith('.html'):
                f.write('<!DOCTYPE html>\n<html>\n<head>\n  <title>ZuZu</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>')
        
        created_empty_files.append(file_path)
    
    return created_empty_files

def main():
    if len(sys.argv) != 3:
        print("Usage: python generator.py <download_folder_path> <project_folder_path>")
        sys.exit(1)
    
    download_path = sys.argv[1]
    project_path = sys.argv[2]
    
    # Check if the paths exist
    if not os.path.exists(download_path):
        print(f"Error: Download folder '{download_path}' does not exist.")
        sys.exit(1)
    
    # Create project directory if it doesn't exist
    if not os.path.exists(project_path):
        os.makedirs(project_path)
    
    print(f"\n=== Setting up ZuZu project in '{project_path}' ===\n")
    
    # Create directory structure
    print("Creating directory structure...")
    created_dirs = create_directory_structure(project_path)
    
    # Get file mapping
    file_mapping = get_file_mapping()
    
    # Copy files
    print(f"Copying files from '{download_path}'...")
    copied_files, missing_files = copy_files(download_path, project_path, file_mapping)
    
    # Create empty files for any missing ones
    # created_empty_files = create_empty_files(project_path, missing_files)
    
    # Create example.json fixture if it doesn't exist
    example_json_path = os.path.join(project_path, "cypress/fixtures/example.json")
    if not os.path.exists(example_json_path):
        with open(example_json_path, 'w') as f:
            f.write('{\n  "example": "This is an example fixture"\n}')
    
    # Print summary
    print("\n=== ZuZu Project Setup Summary ===\n")
    
    print("Directories created:")
    for directory in created_dirs:
        print(f"  ✓ {os.path.relpath(directory, project_path)}")
    
    print("\nFiles copied:")
    for file in copied_files:
        print(f"  ✓ {file}")
    
    if missing_files:
        print("\nMissing files:")
        for file in missing_files:
            print(f"  ! {file}")

    print(f"\nZuZu project setup complete! You can find it at: {os.path.abspath(project_path)}")
    print("\nNext steps:")
    print("1. Navigate to the project directory: cd", os.path.abspath(project_path))
    print("2. Install dependencies: npm install")
    print("3. Start the development server: npm run dev")

if __name__ == "__main__":
    main()