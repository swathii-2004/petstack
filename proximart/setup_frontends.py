import os
import subprocess
import json

base_dir = r"c:\Users\HP\Desktop\petstack\proximart"
apps = ["frontend-user", "frontend-vendor", "frontend-admin"]

# Base package.json
package_json_template = {
  "name": "",
  "private": True,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "lucide-react": "^0.395.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.0",
    "react-router-dom": "^6.24.0",
    "zustand": "^4.5.2",
    "tailwind-merge": "^2.3.0",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.9",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.7",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.3.1"
  }
}

vite_config_template = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: {port}
  }
})
"""

tailwind_config_template = """/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}"""

postcss_config_template = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

tsconfig_template = {
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": True,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": True,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": True,
    "resolveJsonModule": True,
    "isolatedModules": True,
    "noEmit": True,
    "jsx": "react-jsx",
    "strict": True,
    "noUnusedLocals": True,
    "noUnusedParameters": True,
    "noFallthroughCasesInSwitch": True,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

tsconfig_node_template = {
  "compilerOptions": {
    "composite": True,
    "skipLibCheck": True,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": True,
    "strict": True
  },
  "include": ["vite.config.ts"]
}

index_html_template = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ProxiMart {title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>"""

components_json_template = {
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": False,
  "tsx": True,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": True,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}

global_css_template = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
"""

utils_ts_template = """import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
"""

env_template = """VITE_API_URL=http://localhost:8000
"""

for i, app in enumerate(apps):
    app_dir = os.path.join(base_dir, app)
    os.makedirs(app_dir, exist_ok=True)
    os.makedirs(os.path.join(app_dir, "src", "components", "ui"), exist_ok=True)
    os.makedirs(os.path.join(app_dir, "src", "lib"), exist_ok=True)
    os.makedirs(os.path.join(app_dir, "src", "pages"), exist_ok=True)
    os.makedirs(os.path.join(app_dir, "src", "store"), exist_ok=True)
    
    # Write package.json
    pkg = package_json_template.copy()
    pkg["name"] = app
    with open(os.path.join(app_dir, "package.json"), "w") as f:
        json.dump(pkg, f, indent=2)
        
    # Write config files
    with open(os.path.join(app_dir, "vite.config.ts"), "w") as f:
        f.write(vite_config_template.format(port=3000 + i))
        
    with open(os.path.join(app_dir, "tailwind.config.js"), "w") as f:
        f.write(tailwind_config_template)
        
    with open(os.path.join(app_dir, "postcss.config.js"), "w") as f:
        f.write(postcss_config_template)
        
    with open(os.path.join(app_dir, "tsconfig.json"), "w") as f:
        json.dump(tsconfig_template, f, indent=2)
        
    with open(os.path.join(app_dir, "tsconfig.node.json"), "w") as f:
        json.dump(tsconfig_node_template, f, indent=2)
        
    with open(os.path.join(app_dir, "index.html"), "w") as f:
        f.write(index_html_template.format(title=app.split("-")[1].capitalize()))
        
    with open(os.path.join(app_dir, "components.json"), "w") as f:
        json.dump(components_json_template, f, indent=2)
        
    with open(os.path.join(app_dir, ".env"), "w") as f:
        f.write(env_template)
        
    # Write src files
    with open(os.path.join(app_dir, "src", "index.css"), "w") as f:
        f.write(global_css_template)
        
    with open(os.path.join(app_dir, "src", "lib", "utils.ts"), "w") as f:
        f.write(utils_ts_template)
        
    with open(os.path.join(app_dir, "src", "vite-env.d.ts"), "w") as f:
        f.write('/// <reference types="vite/client" />\n')
        
    print(f"Scaffolded {app}")
