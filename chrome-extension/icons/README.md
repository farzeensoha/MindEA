# Icon Placeholder

The extension requires icons in the following sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Creating Icons

You can create these icons using any graphic design tool. The icons should represent the MindEase brand with:
- Calming colors (greens, blues)
- Meditation/wellness theme
- Simple, recognizable design

## Temporary Solution

For development, you can use any PNG images renamed to these sizes, or create simple colored squares:

```bash
# Using ImageMagick (if installed):
convert -size 16x16 xc:'#4a7c59' icon16.png
convert -size 48x48 xc:'#4a7c59' icon48.png
convert -size 128x128 xc:'#4a7c59' icon128.png
```

Or use online tools like:
- Canva (https://www.canva.com)
- Figma (https://www.figma.com)
- Icon generators

Place the generated icons in this directory (`/app/chrome-extension/icons/`).
