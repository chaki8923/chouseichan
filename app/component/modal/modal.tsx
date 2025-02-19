import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from "react-icons/rx";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // 背景クリックで閉じる
        >
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg w-80 relative"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} // 内側クリックで閉じないように
          >
            {/* バツ印を右上に配置 */}
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={onClose}
            >
              <RxCross1 size={20} />
            </button>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
