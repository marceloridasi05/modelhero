export async function rotateToLandscape(base64Image: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const isPortrait = img.height > img.width;
      
      if (!isPortrait) {
        resolve(base64Image);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(base64Image);
        return;
      }
      
      canvas.width = img.height;
      canvas.height = img.width;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const rotatedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      resolve(rotatedBase64);
    };
    
    img.onerror = () => {
      resolve(base64Image);
    };
    
    img.src = base64Image;
  });
}
