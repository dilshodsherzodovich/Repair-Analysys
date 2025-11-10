export function GeometricDesign() {
  const modules = [
    { label: "Шаҳрлантириш", color: "#2e148c", position: "top" },
    { label: "Кириш", color: "#492ead", position: "center" },
    { label: "Мониторинг", color: "#644ac4", position: "bottom-left" },
    { label: "Ҳисобот", color: "#927be3", position: "bottom-right" },
  ]

  return (
    <div className="relative w-80 h-80 mx-auto">
      {modules.map((module, index) => (
        <div
          key={index}
          className="absolute w-24 h-24 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-lg transform rotate-45 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{
            backgroundColor: module.color,
            ...(module.position === "top" && {
              top: "20px",
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
            }),
            ...(module.position === "center" && {
              top: "50%",
              left: "30%",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }),
            ...(module.position === "bottom-left" && {
              bottom: "40px",
              left: "20px",
              transform: "rotate(45deg)",
            }),
            ...(module.position === "bottom-right" && {
              bottom: "20px",
              right: "40px",
              transform: "rotate(45deg)",
            }),
          }}
        >
          <span className="transform -rotate-45 text-center leading-tight px-2">{module.label}</span>
        </div>
      ))}
    </div>
  )
}
