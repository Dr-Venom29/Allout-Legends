import sys
from PIL import Image

def analyze_grid():
    img = Image.open("public/assets/character-spritesheet.png").convert("RGBA")
    width, height = img.size
    
    cell_w = 64
    cell_h = 64
    cols = width // cell_w
    rows = height // cell_h
    
    pixels = img.load()
    
    row_frames = []
    
    for r in range(rows):
        frames_in_row = 0
        for c in range(cols):
            # Check if cell (c, r) is empty
            is_empty = True
            for x in range(c * cell_w, (c + 1) * cell_w):
                for y in range(r * cell_h, (r + 1) * cell_h):
                    if pixels[x, y][3] > 0:
                        is_empty = False
                        break
                if not is_empty:
                    break
            
            if not is_empty:
                frames_in_row += 1
            else:
                pass # Usually frames are contiguous from the left
                
        row_frames.append(frames_in_row)
        
    for r, count in enumerate(row_frames):
        print(f"Row {r}: {count} frames")

if __name__ == "__main__":
    analyze_grid()
