

## Automatic Image Resize & Compression on Upload

Yes — the best approach is **client-side compression before upload** using the browser's Canvas API. This avoids needing an extra backend service and ensures only optimized images hit storage.

### Approach

Add a utility function that takes a `File`, draws it onto an off-screen `<canvas>` at **1280×720** (maintaining aspect ratio with cropping/fitting), then exports it as a compressed JPEG/WebP blob targeting **<200KB**. This runs before the Supabase Storage upload in `ImageUploadButton`.

### Technical Details

1. **Create `src/lib/image-utils.ts`** — a `compressImage(file: File, options)` function:
   - Load the file into an `Image` element
   - Draw onto a canvas at 1280×720 (cover-fit, center-cropped to maintain 16:9)
   - Export as WebP (with JPEG fallback) using `canvas.toBlob()` with iteratively decreasing quality until under 200KB
   - Return the resulting `Blob`

2. **Update `ImageUploadButton` in `AdminCrudPage.tsx`**:
   - Import and call `compressImage()` on the selected file before uploading
   - Change the uploaded file extension to `.webp`
   - No changes needed to the storage bucket or RLS policies

### What This Gives You
- Every uploaded news image is automatically resized to 1280×720 and compressed to <200KB
- No manual Squoosh step needed
- Works entirely in the browser — no edge function required
- WebP format for better compression (with JPEG fallback for older browsers)

