import Wallet from "./wallet";

export default function Header() {
    return (
        <div className="flex items-center justify-between p-4 border-b">
            <div>{/* 필요한 경우 좌측 컨텐츠 */}</div>
            <div>
                <Wallet />
            </div>
        </div>
    );
}
