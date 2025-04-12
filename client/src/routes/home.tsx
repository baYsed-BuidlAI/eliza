import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "@/lib/api";
import type { UUID } from "@elizaos/core";

export default function Home() {
    const navigate = useNavigate();
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.agents;

    useEffect(() => {
        if (agents && agents.length > 0) {
            // 첫 번째 에이전트의 채팅 페이지로 리디렉션
            const firstAgent = agents[0] as { id: UUID; name: string };
            navigate(`/chat/${firstAgent.id}`);
        }
    }, [agents, navigate]);

    // 로딩 중이거나 에이전트가 없는 경우 빈 화면 표시
    return (
        <div className="flex items-center justify-center h-full">
            로딩 중...
        </div>
    );
}
