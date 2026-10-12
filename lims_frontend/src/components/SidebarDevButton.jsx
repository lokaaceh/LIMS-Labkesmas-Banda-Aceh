const SidebarDevButton = ({ label }) => {
  const handleClick = () => {
    toast.info(`Fitur ${label} sedang dalam masa pengembangan 🚀`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-between group"
    >
      <span>{label}</span>
      <span className="text-[10px] text-amber-600 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200 group-hover:bg-amber-200 transition-colors">
        Dev
      </span>
    </button>
  );
};
