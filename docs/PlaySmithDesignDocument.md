## The Idea - Play Smith

I want to build an american football play/playbook creator called "Play Smith". Note we have a registered domain from squarespace "play-smith.com". The idea is that we would have a whiteboard type system where users can create individual plays and collect them together to form playbooks. 

## The Whiteboard

The base background of the white board will be a grey/ white color, specificly #f2f2f2. I have created a mockup of this with the @TestFootballField.tsx @TestFootballFieldStyles.css  files. The background needs to be built to the exact specifications of a college football field which means it must abide by these standards. I am going to feed everything to you in feet, this how we should record it but we may need to apply some feet to pixel scaling (maybe something like 1 feet = 3 pixels)

## Field:
- The base background color should be #f2f2f2
- The total width of the field need to be 160 feet exactly
- The distance from the edge of the field to the innermost part of the hash is 60 feet. This is the same on both sides. This means there is exactly 40 feet separating the two hashes.
- The hash marks are 3 feet apart and every 5th hash mark there is a line extending the width of the field indicating 5 yard increments.
- Every 10 yards there are numbers that stradle the width-spanning lines.
- The numbers are exactly 6 feet tall and the top of the numbers are 15 feet from the edge of the field
- Numbers are just represented with hashtags
- The numbers are "on their side" meaning that the top of hte numbers are closer to the edge of the field than the bottom of the numbers. Similarly the bottom of the numbers are closer to the center of the field than the top of the numbers
- The lines should be relatively low opacity so they don't obscure anything that is drawn over top of it

## Play Editor

There will be a toolbar on the left with multiple icons to click with different functionality. These will be called "Tools". These tools are used to create and edit objects we will call "Components". Here are some other detailing on the play editor

- White board in the center
- Toolbar on the left
- Above the whiteboard are three text input boxes; Formation, Play, Defensive Formation. The text boxes appear in that order left to right. Each of these starts empty with those text values as placeholders.
- Below the whiteboard there is play cards. These play cards are individual components which represent saved instances of other plays. The play cards are rectangles with rounded edges and show the relevant play with a label at the bottom saying the play name. This container is scrollable left to right and if you scroll all the way to the righ there is an add button which lets you add another play
- Individual player tags depending on system? Concepts?
- Send to playbook button?
- Save?
- Color button?
- By default on each play the 5 lineman will auto populate. These players are not removable, but are each individual player components that are connected. These players are just represented by 2ft radius circles and are spaced 1 foot separating each other. The center (middle lineman) gets automatically placed in the center of the field but can be moved to align on either hash by the hash button.

## Tools:

### Select:
- Icon: This will be a cursor icon
- Function: This will enable the user to select an existing component and interact with it (move, resize, add interactions, etc...)
- Keyboard Shortcut: S

### Add Player:
- Icon: Stick Figure Human Icon
- Function: This adds a player to the center of the visible screen. Playes are distinct components that have indepent functionality (more info later). When you have this selected if you drag your cursor into the drawing area your cursor turns into a circle indicating where a player will be placed.
- Keyboard Shortcut: A

### Draw:
- Icon: Pencil Icon (tip of pencil in bottom left corner, eraser in top right corner. Pencil sits a 45 degree angle)
- Function: This will allow the user to freehand draw lines and other shapes with the cursor on the whiteboard. whenever a drawing is complete we save that as a component. There will also be a sub dialog that opens next to the tool where you can change things about the line (solid vs hashed, end in arrow, T shape, or none)
- Custom Cursor: Yes (tip of the pencil indicates where you are drawing). Custom cursor only applies when over the canvas.
- Keyboard Shortcut: D

### Erase:
- Icon: Rubber Eraser Icon
- Function: When selected this allows the user to click on elements in the canvas and erase them
- Keyboard Shortcut: E

### Fill Color:
- Icon: Paint Bucket
- Function: Uses whatever color is set in the color wheel and dynamically set whatever is clicked to that color
- Keyboard Shortcut: F

### Color:
- Icon: Color Wheel
- Function: Opens up a color selector with some preset options that determine the color that gets drawn.
- Keyboard Shortcut: C

### Route:
- Icon: Route tree icon (tbd)
- Function: This opens a dialog where there are a set of pre-defined routes are available to add. Some of these routes include the basic route tree (numbers linked to route) 1. Flat 2. Slant 3. Comeback 4. Curl 5. Out 6. Dig 7. Corner 8. Post 9. Go
Keyboard Shortcut: R

### Add Component:
- Icon: Plus Icon (+)
- Function: This will allow the user to add a copy of a saved component to the field
- Keyboard Shortcut: G

### Ball on Hash: 
- Icon: Hash Marker Icon (three dashed lines stacked vertically with spacing)
- Function: This opens a small dialog with three options. Left, Middle, Right. By default middle is selected. This represents where the ball is on the field, in UI this means we shift the 5 default offensive lineman to either be centered on the left hash, the middle of the field, or the right hash.
- Keyboard Shortcut: H (Might want to do something like this later 1 (Left), 2 (Middle), 3 (Right))

### Hide/Show Play Bar:
- Icon: Open eyeball or closed eyeball (depending onstate) 
- Function: This shows and hides the play bar at the bottom below the white board on toggle. If play bar is showing the icon is an open eye, if the play bar is hidden it shows a closed eye. There should be a smooth animation where the playcards in the playbar drift off the bottom screen and another smooth animation of the whiteboard getting pulled down. We should also have animations for the reverse of this. Note that as the whiteboard gets pulled down I want the players and everything represented on it to get pulled down as well so if in theory 10 more yards of space gets pulled down the new space would look like it actually appears from the top of the whiteboard.

### Settings Button:
- Icon: Cog Wheel
- Function: This opens a dialog of settings that the user can change. These are values that are saved by the user and cross over between all plays and play books. For each of the following settings there will be a text label with a control to change its value.

#### List of Settings
- Label: "Position Naming System". Values (choose 1): (X, Y, Z, A, B, Q), (X, Y, Z, F, T, Q), (Custom). Function: These represent the letters the represent the different offensive skill positions
- Label: Competition Level. Values (choose one): High School, College, Pro. Function: This changes the distance of the hashes and other things (to be determined)
- Label: Appearance. Values (Light Mode, Dark Mode). Function: Changes the app from light mode (light color scheme) to dark mode (dark color scheme), doesn't change any functionality just the colors.
- Label: Move Skills on Hash Change: Values: Yes, No. Function: The lineman move by default when the hash changes, this flag tells us whether we want to move the skill position players with them (more details to be worked out)

## Playbook Management

We should need a system to manage playbooks. Playbooks will essentially be collections of plays with possibly some other features (tbd). These we are oging to need export import functionality and a design for this page (maybe take inspiration from the google drive UI?).

## Login

We are going to need a login page with user authentication at some point. This can be a later stage development, probably around when we start migrating from SQLite to MySQL.

## Things to consider

- We need to make sure we have a system to save all of these components and retrieve them efficiently. We want to ensure we have good modularity too
- We should keep track in a logical and clear way the color scheme and styling conventions of the app so we can easily build and maintain.
- I have an idea of being able to type a play call and intelligently generate a play based on that. We would probably need a mix of deterministic programming and LLM integration for this. (Idea, LLM interprets and formats to JSON which connects to our api for creating necessary components).

## Future ideas:

- Allow for free hand drawing to automatically correct to most similar shape (straighten lines, make corners sharper etc)
- Have pre-set routes with terminology attached based on the offensive system
- Play concept support (specific routes and plays that can be added together)
- Play sheet creation
- Import/export to and from hudl?
- Annotations at specific points on routes (UI tbd)
- Outsource MySQL
- Analysis of strengths and weaknesses of current play versus opponent formation/play? 
- Weekly playbooks? Change their appearance of the defense based on what the opposing team plays?
- Ability to double click things in the dialogs to set them as defaults?
- Shouldn't just apply high z index values to fix. Should be targeted and just enough to be effective
