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
- The numbers are "on their side" meaning that the top of hte numbers are closer to the edge of the field than the bottom of the numbers. Similarly the bottom of the numbers are closer to the center of the field than the top of the numbers
- The lines should be relatively low opacity so they don't obscure anything that is drawn over top of it

There will be a toolbar on the left with multiple icons to click with different functionality. These will be called "Tools". These tools are used to create and edit objects we will call "Components"

## Tools:

### Select:
- Icon: This will be a cursor icon
- Function: This will enable the user to select an existing component and interact with it (move, resize, add interactions, etc...)

### Add Player:
- Icon: Helmet Icon
- Function: This adds a player to the center of the visible screen. Playes are distinct components that have indepent functionality (more info later)

### Draw:
- Icon: Paint Brush Icon
- Function: This will allow the user to freehand draw lines and other shapes with the cursor on the whiteboard. whenever a drawing is complete we save that as a component. There will also be a sub dialog that opens next to the tool where you can change things about the line (solid vs hashed, end in arrow, T shape, or none)

### Route:
- Icon: Route tree icon (tbd)
- Function: This opens a dialog where there are a set of pre-defined routes are available to add. Some of these routes include the basic route tree (numbers linked to route) 1. Flat 2. Slant 3. Comeback 4. Curl 5. Out 6. Dig 7. Corner 8. Post 9. Go

### Add Component:
- Icon: Plus Icon (+)
- Function: This will allow the user to add a copy of a saved component to the field

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
