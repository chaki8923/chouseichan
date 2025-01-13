
import styles from "./index.module.scss";

export default function Flow(props: { step: string }) {

  return (
    <>
      <ol className={`flex items-center w-full p-3 space-x-2 text-sm font-medium text-center rounded-lg shadow-sm sm:text-base  sm:p-4 sm:space-x-4 rtl:space-x-reverse ${styles.flowBg}`}>
        <li className="flex items-center">
          <span className="flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0">
            1
          </span>
           <span className="hidden sm:inline-flex sm:ms-2">イベント名を登録</span>
          <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4" />
          </svg>
        </li>
        <li className="flex items-center">
          <span className="flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0">
            2
          </span>
          <span className="hidden sm:inline-flex sm:ms-2">日程を登録</span>
          <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4" />
          </svg>
        </li>
        <li className="flex items-center">
          <span className="flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ">
            3
          </span>
          Review
        </li>
      </ol>


    </>
  )
}