cd ..
cd ./backend/finish
.\mvnw.cmd liberty%:dev

:: Run liberty:stop instead of liberty:dev if you are getting errors for a live liberty instance blocking start