import { useState, useRef, useCallback } from 'react';
import { Event } from "@/types/event";
import Modal from "../modal/modal";
import styles from "./index.module.scss";
import { FiUpload, FiX, FiImage, FiCamera, FiAlertCircle, FiCrop } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

// 最大サイズ (2MB)
const MAX_TOTAL_SIZE = 2 * 1024 * 1024;

const ImageUploadSection: React.FC<{ eventData: Event; onImageUploaded?: () => void; }> = ({ eventData, onImageUploaded }) => {
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [modalText, setModalText] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [totalSize, setTotalSize] = useState<number>(0);
    const [showAlbumOverlay, setShowAlbumOverlay] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files as FileList);
        addFiles(files);
    };

    const addFiles = (files: File[]) => {
        setErrorMessage(null);
        
        // 画像ファイルのみフィルタリング
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        // 合計サイズを計算
        const newTotalSize = imageFiles.reduce((sum, file) => sum + file.size, totalSize);
        
        // 合計サイズのチェック
        if (newTotalSize > MAX_TOTAL_SIZE) {
            setErrorMessage(`画像の合計サイズが2MBを超えています（現在: ${(newTotalSize / (1024 * 1024)).toFixed(2)}MB）`);
            return;
        }
        
        setTotalSize(newTotalSize);
        setSelectedImages(prev => [...prev, ...imageFiles]);
        
        // プレビューURLを生成
        const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index: number) => {
        // 削除する画像のサイズを計算
        const sizeToRemove = selectedImages[index].size;
        
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        
        // プレビューURLを解放してメモリリークを防止
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        
        // 合計サイズを更新
        setTotalSize(prev => prev - sizeToRemove);
        
        // エラーメッセージをクリア（削除後にサイズが適切になる可能性があるため）
        setErrorMessage(null);
    };

    const handleUpload = async () => {
        if (selectedImages.length === 0) {
            setModalText('アップロードする画像を選択してください');
            setIsOpen(true);
            return;
        }

        // 合計サイズの最終チェック
        if (totalSize > MAX_TOTAL_SIZE) {
            setErrorMessage(`画像の合計サイズが2MBを超えています（現在: ${(totalSize / (1024 * 1024)).toFixed(2)}MB）`);
            return;
        }

        setIsUploading(true);
        setErrorMessage(null); // アップロード開始時にエラーメッセージをクリア

        try {
            await uploadImagesToCloudflare(selectedImages, eventData.id);
            
            // フォームをリセット
            setSelectedImages([]);
            setPreviewUrls(prev => {
                // すべてのURLを解放
                prev.forEach(url => URL.revokeObjectURL(url));
                return [];
            });
            setTotalSize(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // 親コンポーネントに通知（画像が取得される）
            if (onImageUploaded) {
                onImageUploaded();
            }
            
            // アルバム表示前のオーバーレイを表示
            setShowAlbumOverlay(true);
            
            // 3秒後にアルバム表示オーバーレイを非表示にする
            setTimeout(() => {
                setShowAlbumOverlay(false);
                setIsUploading(false);
                
                // URLパラメータを直接変更（リロードなし）
                const queryParams = new URLSearchParams(window.location.search);
                queryParams.set('tab', 'album');
                const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
                window.history.pushState({}, '', newUrl);
                
                // イベントは発行せず、直接親コンポーネントのコールバックを再度呼び出して画像表示
                if (onImageUploaded) {
                    onImageUploaded();
                }
            }, 3000);
        } catch (error) {
            console.error('画像アップロード中にエラーが発生しました:', error);
            setIsUploading(false);
            
            // エラーメッセージを設定
            if (error instanceof Error) {
                setErrorMessage(error.message || 'アップロード中にエラーが発生しました。もう一度お試しください。');
            } else {
                setErrorMessage('アップロード中に予期せぬエラーが発生しました。もう一度お試しください。');
            }
            
            // モーダルメッセージも表示
            setModalText('画像のアップロードに失敗しました。もう一度お試しください。');
            setIsOpen(true);
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

    // ファイルサイズを人間が読みやすい形式に変換する関数
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // プレビュー表示用のスライド生成
    const renderPreviewSlides = () => {
        return previewUrls.map((url, index) => (
            <SwiperSlide key={index} className={styles.filmFrameSlide}>
                <div className={styles.filmFrame}>
                    <div className={styles.filmHeader}>
                        <span className={styles.filmCounter}>#{index + 1}</span>
                        <span className={styles.filmDate}>{formatFileSize(selectedImages[index].size)}</span>
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
        <>
            {/* アップロード完了後のオーバーレイモーダル */}
            {showAlbumOverlay && (
                <div className={styles.uploadOverlay}>
                    <div className={styles.uploadModalContent}>
                        <img 
                            src="/images/album-icon.png" 
                            alt="アルバムアイコン" 
                            className={styles.uploadModalImage}
                            onError={(e) => {
                                // 画像が存在しない場合のフォールバック
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <h3 className={styles.uploadModalTitle}>アップロード完了！</h3>
                        <div className={styles.uploadSpinner}></div>
                        <p className={styles.uploadModalText}>アルバムを表示します</p>
                        <p className={styles.uploadModalSubtext}>しばらくお待ちください...</p>
                    </div>
                </div>
            )}
            
            {/* アップロード中のオーバーレイ */}
            {isUploading && !showAlbumOverlay && (
                <div className={styles.uploadOverlay}>
                    <div className={styles.uploadModalContent}>
                        <div className={styles.uploadSpinner}></div>
                        <h3 className={styles.uploadModalTitle}>アップロード中...</h3>
                        <p className={styles.uploadModalText}>画像をアップロードしています</p>
                        <p className={styles.uploadModalSubtext}>しばらくお待ちください</p>
                    </div>
                </div>
            )}
            
            <div className={`${styles.formCard} ${styles['fade-in']}`}>
                <div className={styles.formStep}>
                    <h3 className={styles.stepTitle}>イベント写真のアップロード</h3>
                </div>
                
                {errorMessage && (
                    <div className={styles.errorContainer}>
                        <FiAlertCircle className={styles.errorIcon} />
                        <span className={styles.errorMessage}>
                            {errorMessage}
                            {errorMessage.includes('画像の合計サイズが2MBを超えています') && (
                                <div className={styles.resizeToolWrapper}>
                                    <Link href={`/image-resize?eventId=${eventData.id}`} className={styles.resizeToolLink}>
                                        <FiCrop className={styles.resizeToolIcon} />
                                        <span>大きな画像を縮小するツールを使う</span>
                                    </Link>
                                    <p className={styles.resizeToolHint}>スマホで撮影した画像が大きすぎる場合はこちらをご利用ください</p>
                                </div>
                            )}
                        </span>
                    </div>
                )}
                
                <div className={styles.uploadStats}>
                    <div className={styles.uploadStat}>
                        <span className={styles.uploadStatLabel}>選択:</span>
                        <span className={styles.uploadStatValue}>{selectedImages.length}枚</span>
                    </div>
                    <div className={styles.uploadStat}>
                        <span className={styles.uploadStatLabel}>合計:</span>
                        <span className={`${styles.uploadStatValue} ${totalSize > MAX_TOTAL_SIZE ? styles.uploadStatValueError : ''}`}>
                            {formatFileSize(totalSize)} / 2MB
                        </span>
                    </div>
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
                            disabled={isUploading || showAlbumOverlay}
                        />
                        <FiUpload className={styles.uploadIcon} />
                        <p className={styles.dropZoneText}>
                            画像をドラッグ＆ドロップ<br />
                            または<span>クリックして選択</span>
                        </p>
                        <p className={styles.uploadLimitText}>※合計サイズ2MBまで</p>
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
                                    <FiCamera className={styles.filmIcon} /> {previewUrls.length}枚の画像 ({formatFileSize(totalSize)})
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
                                disabled={isUploading || showAlbumOverlay || totalSize > MAX_TOTAL_SIZE}
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
        </>
    );
};

const uploadImagesToCloudflare = async (files: File[], eventId: string) => {
    try {
        const formData = new FormData();
        
        // ファイルを追加
        files.forEach(file => formData.append('file', file));

        // eventId を追加
        formData.append('eventId', eventId);
        formData.append('folder', 'event_images'); // 保存先フォルダを指定

        // APIへリクエスト送信
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Upload failed:', errorData);
            throw new Error(errorData.error || 'アップロードに失敗しました');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in uploadImagesToCloudflare:', error);
        throw error; // エラーを呼び出し元に伝播
    }
};

export default ImageUploadSection;
