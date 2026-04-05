#!/bin/bash
# Simple SVG to PNG conversion for icons

# Create SVG icon
cat > icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#4a7c59" rx="20"/>
  <circle cx="64" cy="64" r="35" fill="#c6f6d5"/>
  <path d="M 64 44 Q 54 54 54 64 T 64 84" stroke="#4a7c59" stroke-width="3" fill="none"/>
  <circle cx="64" cy="50" r="3" fill="#4a7c59"/>
</svg>
EOF

echo "Icon placeholder created as SVG"
echo "Note: Actual PNG conversion requires imagemagick or online tools"
echo "For now, you can use the SVG or convert online at https://cloudconvert.com/svg-to-png"
