// Toggles the .bl-hidden utility class (display: none !important), which beats
// the flex/block base rules of the panel regions — unlike the `hidden` attribute.
export function setHidden(element: HTMLElement, hidden: boolean): void {
	element.classList.toggle("bl-hidden", hidden);
}
