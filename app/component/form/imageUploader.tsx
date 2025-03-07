import { useState, useRef, useCallback } from 'react';
import { Event } from "@/types/event";
import Modal from "../modal/modal";
import styles from "./index.module.scss";
import { FiUpload, FiX, FiImage, FiCamera } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const ImageUploadSection: React.FC<{ eventData: Event; onImageUploaded?: () => void; }> = ({ eventData, onImageUploaded }) => {
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
            await uploadImagesToCloudflare(selectedImages, eventData.id);
            
            // フォームをリセット
            setSelectedImages([]);
            setPreviewUrls(prev => {
                // すべてのURLを解放
                prev.forEach(url => URL.revokeObjectURL(url));
                return [];
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // 先に親コンポーネントに通知してから、モーダルを表示する
            if (onImageUploaded) {
                onImageUploaded();
            }
            
            // 最後にモーダルを表示
            setModalText('画像のアップロードが完了しました。ページをリロードします...');
            setIsOpen(true);
            
            // モーダルを表示した後、少し待ってからリロード
            setTimeout(() => {
                // リロードする前に必要なデータをすべて保存済みなので安全
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error("Error uploading images:", error);
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

    // 現在の日付をフォーマットする関数
    const getFormattedDate = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };

    const currentDate = getFormattedDate();

    // プレビュー表示用のスライド生成
    const renderPreviewSlides = () => {
        return previewUrls.map((url, index) => (
            <SwiperSlide key={index} className={styles.filmFrameSlide}>
                <div className={styles.filmFrame}>
                    <div className={styles.filmHeader}>
                        <span className={styles.filmCounter}>#{index + 1}</span>
                        <span className={styles.filmDate}>{currentDate}</span>
                    </div>
                    <div className={styles.filmImageContainer}>
                        <img 
                            src={url} 
                            alt={`プレビュー ${index + 1}`} 
                            className={styles.filmImage}
                        />
                        <button 
                            className={styles.filmRemoveBtn}
                            onClick={() => removeImage(index)}
                            type="button"
                            aria-label="画像を削除"
                        >
                            <FiX />
                        </button>
                    </div>
                    <div className={styles.filmFooter}>
                        <span className={styles.filmCaption}>ShukkeTU-400</span>
                    </div>
                </div>
            </SwiperSlide>
        ));
    };

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
                    <div className={styles.filmStripContainer}>
                        <div className={styles.filmEdge}>
                            {[...Array(8)].map((_, i) => (
                                <div key={`hole-top-${i}`} className={styles.filmHole}></div>
                            ))}
                        </div>
                        
                        <div className={styles.filmStripContent}>
                            <div className={styles.filmCountText}>
                                <FiCamera className={styles.filmIcon} /> {previewUrls.length}枚の画像
                            </div>
                            
                            <Swiper
                                modules={[Navigation, Pagination, EffectCoverflow]}
                                effect="coverflow"
                                grabCursor={true}
                                centeredSlides={true}
                                slidesPerView={previewUrls.length > 2 ? 3 : previewUrls.length}
                                coverflowEffect={{
                                    rotate: 5,
                                    stretch: 0,
                                    depth: 100,
                                    modifier: 1,
                                    slideShadows: true,
                                }}
                                pagination={{ clickable: true }}
                                navigation={previewUrls.length > 3}
                                className={styles.filmStripSwiper}
                            >
                                {renderPreviewSlides()}
                            </Swiper>
                        </div>
                        
                        <div className={styles.filmEdge}>
                            {[...Array(8)].map((_, i) => (
                                <div key={`hole-bottom-${i}`} className={styles.filmHole}></div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedImages.length > 0 && (
                    <div className={styles.uploadActionContainer}>
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
    const result = await response.json();

    
    return result;
};

export default ImageUploadSection;
