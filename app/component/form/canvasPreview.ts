import { PixelCrop } from 'react-image-crop'

const TO_RADIANS = Math.PI / 360

export async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement | null,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
) {
  // キャンバス要素が存在しない場合は早期リターン
  if (!canvas) {
    console.warn('Canvas element is not available')
    return
  }

  let ctx;
  try {
    ctx = canvas.getContext('2d');
  } catch (error) {
    console.warn('Failed to get canvas context:', error);
    return;
  }

  if (!ctx) {
    console.warn('No 2d context available');
    return;
  }

  try {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // devicePixelRatioへのアクセスをtry-catchで保護
    let pixelRatio = 1;
    try {
      if (typeof window !== 'undefined' && window.devicePixelRatio) {
        pixelRatio = window.devicePixelRatio;
      }
    } catch (error) {
      console.warn('Failed to access devicePixelRatio, using fallback value:', error);
    }

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    const rotateRads = rotate * TO_RADIANS;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();

    // 5) Move the crop origin to the canvas origin (0,0)
    ctx.translate(-cropX, -cropY);
    // 4) Move the origin to the center of the original position
    ctx.translate(centerX, centerY);
    // 3) Rotate around the origin
    ctx.rotate(rotateRads);
    // 2) Scale the image
    ctx.scale(scale, scale);
    // 1) Move the center of the image to the origin (0,0)
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    );

    ctx.restore();
  } catch (error) {
    console.warn('Error in canvas preview:', error);
  }
}
