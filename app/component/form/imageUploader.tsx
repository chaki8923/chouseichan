import { useState, useRef, useCallback } from 'react';
import { Event } from "@/types/event";
import Modal from "../modal/modal";
import styles from "./index.module.scss";
import { FiUpload, FiX, FiImage } from 'react-icons/fi';

const ImageUploadSection: React.FC<{ eventData: Event; }> = ({ eventData }) => {
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [modalText, setModalText] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files as FileList);
        addFiles(files);
    };

    const addFiles = (files: File[]) => {
        // 画像ファイルのみフィルタリング
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        setSelectedImages(prev => [...prev, ...imageFiles]);
        
        // プレビューURLを生成
        const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        
        // プレビューURLを解放してメモリリークを防止
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedImages.length === 0) {
            setModalText('アップロードする画像を選択してください');
            setIsOpen(true);
            return;
        }

        setIsUploading(true);

        try {
            const imagePaths = await uploadImagesToCloudflare(selectedImages, eventData.id);
            setModalText('画像のアップロードが完了しました');
            setIsOpen(true);
            // アップロード成功後にリセット
            setSelectedImages([]);
            setPreviewUrls(prev => {
                // すべてのURLを解放
                prev.forEach(url => URL.revokeObjectURL(url));
                return [];
            });
        } catch (error) {
            console.error('Image upload failed:', error);
            setModalText('画像のアップロードに失敗しました');
            setIsOpen(true);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            addFiles(files);
        }
    }, []);

    return (
        <div className={`${styles.formCard} ${styles['fade-in']}`}>
            <div className={styles.formStep}>
                <div className={styles.stepNumber}>3</div>
                <h3 className={styles.stepTitle}>イベント写真のアップロード</h3>
            </div>
            
            <div className={styles.formSection}>
                <div 
                    className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className={styles.fileInput}
                        ref={fileInputRef}
                    />
                    <FiUpload className={styles.uploadIcon} />
                    <p className={styles.dropZoneText}>
                        画像をドラッグ＆ドロップ<br />
                        または<span>クリックして選択</span>
                    </p>
                </div>

                {previewUrls.length > 0 && (
                    <div className={styles.previewContainer}>
                        {previewUrls.map((url, index) => (
                            <div key={index} className={styles.previewItem}>
                                <div className={styles.previewImageWrapper}>
                                    <img 
                                        src={url} 
                                        alt={`プレビュー ${index + 1}`} 
                                        className={styles.previewImage}
                                    />
                                    <button 
                                        className={styles.removeImageBtn}
                                        onClick={() => removeImage(index)}
                                        type="button"
                                        aria-label="画像を削除"
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedImages.length > 0 && (
                    <div className={styles.uploadActionContainer}>
                        <p className={styles.selectedCount}>
                            {selectedImages.length}枚の画像が選択されています
                        </p>
                        <button 
                            onClick={handleUpload} 
                            className={styles.submitButton}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>アップロード中...</>
                            ) : (
                                <>
                                    <FiImage style={{ marginRight: '8px' }} />
                                    画像をアップロード
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <h2 className={styles.modalTitle}>{modalText}</h2>
            </Modal>
        </div>
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
