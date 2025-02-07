
import {auth, signIn} from "@/auth";
import {google, calendar_v3} from 'googleapis'
import SignInButton from "../component/calendar/SignInButton"; // クライアントコンポーネントをインポート
import Calendar = calendar_v3.Calendar


export default async function Page() {{
    // サーバ・コンポーネントでセッションを取得する。
    const session = await auth();
    const user = session?.user

    // Google OAuthへの接続
    const oauth2Client = new google.auth.OAuth2({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	// GCPコンソールで設定したredirect URI
        redirectUri: 'http://localhost:3000'
    })
    
    const accessToken = user?.accessToken // Googleが払い出したアクセストークン
    if (!accessToken) {
        return (
            <SignInButton />
        )
    }

    // トークンを設定。refresh_tokenも渡せます。
    oauth2Client.setCredentials({access_token: accessToken})
    
    // カレンダーオブジェクト作成
    const calendar: Calendar = google.calendar({version: 'v3', auth: oauth2Client})
    
    // カレンダー一覧を取得
    const calendarResponse = await calendar.calendarList.list()

    console.log(calendarResponse.data)

    return (
        <main
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "70vh",
            }}
        >
            <div>
                <div>よしなにレンダリング。calendarResponse.data</div>
            </div>
        </main>
    );
}