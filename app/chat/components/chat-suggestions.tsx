import { CHAT_SUGGESTIONS } from "../constants/chat";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CHAT_SUGGESTIONS.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() =>
                handleSuggestionClick(suggestion.title, suggestion.description)
              }
              className="cursor-pointer group relative p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 text-left hover:shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-colors">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900 mb-0.5">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-gray-500">
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
