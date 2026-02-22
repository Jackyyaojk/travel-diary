# How to Use Your Travel Diary

1.  **Open the Map**:
    *   Find the file `index.html` in the folder `travel-diary`.
    *   Double-click it to open it in your web browser (Chrome, Safari, etc.).

2.  **Add Your Own Trips**:
    *   Open the file `data.js` in a text editor (like Notepad, TextEdit, or VS Code).
    *   You will see two sections: `intl` (International) and `domestic` (Domestic).
    *   Copy and paste an existing entry (the part inside `{ ... }`) and change the details:
        *   `name`: The name of the place.
        *   `desc`: Your memory or description.
        *   `date`: When you visited.
        *   `lat`, `lng`: The coordinates. You can find these on Google Maps (right-click a place and select "What's here?").
        *   `photo`: The path to your photo.

3.  **Add Your Photos**:
    *   Create a folder named `photos` inside `travel-diary`.
    *   Put your images there.
    *   In `data.js`, update the `"photo"` field to point to your image, e.g., `"photo": "photos/my-trip.jpg"`.

4.  **Customizing the Map**:
    *   The map is currently set to black and white (grayscale). If you want color, open `styles.css` and remove the `.leaflet-tile` section.
