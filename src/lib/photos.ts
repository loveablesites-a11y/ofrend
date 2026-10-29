export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file such as JPG, PNG, or WebP.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("That image is larger than 12 MB. Choose a smaller photo.");
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image could not be opened."));
      element.src = imageUrl;
    });

    const maxDimension = 1400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("This photo could not be compressed."))),
        "image/jpeg",
        0.82,
      );
    });
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("This photo could not be saved."));
      reader.onerror = () => reject(new Error("This photo could not be saved."));
      reader.readAsDataURL(blob);
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
