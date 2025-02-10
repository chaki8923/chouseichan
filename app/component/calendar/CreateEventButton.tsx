'use client'
import {google} from 'googleapis'

type tokenProps = {
    accessToken: string;
}

export async function CreateEventButton(props: tokenProps) {

    

    return (
        <button
        // onClick={() => createEvent(props.accessToken)} // ユーザーの accessToken を渡す
        style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
        }}
    >
        Google カレンダーに予定を追加
    </button>
    )
}