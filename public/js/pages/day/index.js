const rail = document.querySelector("[data-day-page] #dayRail");
const activeDay = rail?.querySelector('[aria-current="date"]');

activeDay?.scrollIntoView({
	behavior: "instant",
	inline: "center",
	block: "nearest",
});

document.querySelector("[data-scroll-left]")?.addEventListener("click", () => {
	rail?.scrollBy({ left: -240, behavior: "smooth" });
});

document.querySelector("[data-scroll-right]")?.addEventListener("click", () => {
	rail?.scrollBy({ left: 240, behavior: "smooth" });
});
