import { CHAT_SUGGESTIONS } from "../../../../app/chat/constants/chat";

const ChatSuggestions = ({
  handleSend,
}: {
  handleSend: (message: string) => void;
}) => {
  const handleSuggestionClick = (title: string, description: string) => {
    handleSend(`${title} ${description}`);
  };
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CHAT_SUGGESTIONS.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() =>
                handleSuggestionClick(suggestion.title, suggestion.description)
              }
              className="cursor-pointer group relative p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/50 hover:border-border transition-all duration-200 text-left hover:shadow-md"
            >
              <div className="flex flex-col gap-2.5">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-teal-500/10 to-teal-600/10 group-hover:from-teal-500/20 group-hover:to-teal-600/20 transition-colors">
                  <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground mb-1">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ChatSuggestions;
