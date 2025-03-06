import { motion, AnimatePresence } from "framer-motion";
import { RxCross1 } from "react-icons/rx";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  type?: 'default' | 'warning' | 'info';
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, type = 'default' }) => {
  const getModalStyles = () => {
    switch (type) {
      case 'warning':
        return {
          backdrop: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50",
          container: "bg-white p-8 rounded-xl shadow-lg w-96 relative border-l-4 border-yellow-500",
          closeButton: "absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors duration-200"
        };
      case 'info':
        return {
          backdrop: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50",
          container: "bg-white p-8 rounded-xl shadow-lg w-96 relative border-l-4 border-blue-500",
          closeButton: "absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors duration-200"
        };
      default:
        return {
          backdrop: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50",
          container: "bg-white p-8 rounded-xl shadow-lg w-96 relative",
          closeButton: "absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors duration-200"
        };
    }
  };

  const styles = getModalStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.container}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="閉じる"
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
