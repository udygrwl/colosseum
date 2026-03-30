import AnalysisPanel from './AnalysisPanel'
import RoleplayStage from './RoleplayStage'

export default function RoleplayPage({
  models, conversations, selectedConvId, onSelectConv,
  onStartRun, onStop, chatHistory, onSendChat, isChatThinking,
}) {
  const isRunning = conversations.find(c => c.id === selectedConvId)?.status === 'running'

  return (
    <div className="flex flex-1 min-h-0 h-[calc(100vh-57px)]">
      {/* Left — Analysis Panel */}
      <div className="w-80 xl:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <AnalysisPanel
          models={models}
          chatHistory={chatHistory}
          onSend={onSendChat}
          isThinking={isChatThinking}
          conversations={conversations}
          selectedConvId={selectedConvId}
        />
      </div>

      {/* Right — Roleplay Stage */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <RoleplayStage
          models={models}
          conversations={conversations}
          selectedConvId={selectedConvId}
          onSelectConv={onSelectConv}
          onStartRun={onStartRun}
          onStop={onStop}
          isRunning={isRunning}
        />
      </div>
    </div>
  )
}
