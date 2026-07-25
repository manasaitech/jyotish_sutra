import os
from PIL import Image

logo_path = r"C:\Users\ASUS\.gemini\antigravity-ide\brain\f41d30dd-9e60-412f-9998-8059b187674a\media__1784994897979.png"
base_dir = r"c:\Users\ASUS\Desktop\Kundli_GPT_Clone\AstroSutra-Mobile"

# List of all target paths and their respective square sizes (width, height)
icons = [
    # Android mipmaps
    (os.path.join(base_dir, "android", "app", "src", "main", "res", "mipmap-mdpi", "ic_launcher.png"), (48, 48)),
    (os.path.join(base_dir, "android", "app", "src", "main", "res", "mipmap-hdpi", "ic_launcher.png"), (72, 72)),
    (os.path.join(base_dir, "android", "app", "src", "main", "res", "mipmap-xhdpi", "ic_launcher.png"), (96, 96)),
    (os.path.join(base_dir, "android", "app", "src", "main", "res", "mipmap-xxhdpi", "ic_launcher.png"), (144, 144)),
    (os.path.join(base_dir, "android", "app", "src", "main", "res", "mipmap-xxxhdpi", "ic_launcher.png"), (192, 192)),
    
    # iOS Assets
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-20x20@1x.png"), (20, 20)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-20x20@2x.png"), (40, 40)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-20x20@3x.png"), (60, 60)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-29x29@1x.png"), (29, 29)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-29x29@2x.png"), (58, 58)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-29x29@3x.png"), (87, 87)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-40x40@1x.png"), (40, 40)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-40x40@2x.png"), (80, 80)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-40x40@3x.png"), (120, 120)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-60x60@2x.png"), (120, 120)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-60x60@3x.png"), (180, 180)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-76x76@1x.png"), (76, 76)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-76x76@2x.png"), (152, 152)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-83.5x83.5@2x.png"), (167, 167)),
    (os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Icon-App-1024x1024@1x.png"), (1024, 1024)),

    # Web Icons
    (os.path.join(base_dir, "web", "favicon.png"), (16, 16)),
    (os.path.join(base_dir, "web", "icons", "Icon-192.png"), (192, 192)),
    (os.path.join(base_dir, "web", "icons", "Icon-512.png"), (512, 512)),
    (os.path.join(base_dir, "web", "icons", "Icon-maskable-192.png"), (192, 192)),
    (os.path.join(base_dir, "web", "icons", "Icon-maskable-512.png"), (512, 512)),

    # macOS Assets
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_16.png"), (16, 16)),
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_32.png"), (32, 32)),
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_64.png"), (64, 64)),
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_128.png"), (128, 128)),
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_256.png"), (256, 256)),
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_512.png"), (512, 512)),
    (os.path.join(base_dir, "macos", "Runner", "Assets.xcassets", "AppIcon.appiconset", "app_icon_1024.png"), (1024, 1024)),
]

def generate():
    img = Image.open(logo_path)
    
    # We want a square output icon. Since the logo is a landscape rect, we can fit it inside a square with transparent or white background,
    # or just crop/pad it. Usually, a launcher icon should show the main symbol padded.
    # Let's fit the image in a square canvas with transparency.
    width, height = img.size
    max_dim = max(width, height)
    
    # Let's create a square canvas and paste the image in the center
    square_img = Image.new("RGBA", (max_dim, max_dim), (255, 255, 255, 0))
    offset = ((max_dim - width) // 2, (max_dim - height) // 2)
    square_img.paste(img, offset)
    
    for path, size in icons:
        # Ensure target folder exists
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # Resize using LANCZOS filter
        resized = square_img.resize(size, Image.Resampling.LANCZOS)
        resized.save(path, "PNG")
        print(f"Generated {size[0]}x{size[1]} icon at {path}")

if __name__ == "__main__":
    generate()
