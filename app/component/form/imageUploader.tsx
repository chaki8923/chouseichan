import { useState } from 'react';
import Image from 'next/image';
import { Event } from "@/types/event";
import Modal from "../modal/modal";
import styles from "./index.module.scss"

const ImageUploadSection: React.FC<{ eventData: Event; }> = ({ eventData }) => {
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [modalText, setModalText] = useState<string>('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files as FileList);
        setSelectedImages(files);
        setPreviewUrls(files.map(file => URL.createObjectURL(file)));
    };

    const handleUpload = async () => {
        if (selectedImages.length === 0) return;
        try {
            const imagePaths = await uploadImagesToCloudflare(selectedImages, eventData.id);
            console.log('Uploaded images:', imagePaths);
        } catch (error) {
            console.error('Image upload failed:', error);
        }
    };

    return (
        <>
            <div className="image-upload-section">
                <h3>イベントの写真をアップロード</h3>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                <div className="preview-container">
                    {previewUrls.map((url, index) => (
                        <Image key={index} src={url} alt="Preview" width={100} height={100} />
                    ))}
                </div>
                <button onClick={handleUpload} className={styles.uploadBtn}>アップロード</button>
            </div>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <h2 className={styles.modalTitle}>{modalText}</h2>
                <p className={styles.modalText}></p>
            </Modal>
        </>
    );
};

const uploadImagesToCloudflare = async (files: File[], eventId: string) => {
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));

    // eventId と userId を追加
    formData.append('eventId', eventId);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
};

export default ImageUploadSection;
