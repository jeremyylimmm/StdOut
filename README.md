# StdOut

## Google Auth Setup (No Mongo Required)

1. Copy [.env.example](.env.example) to `.env`.
2. Create a Google OAuth 2.0 Web client in Google Cloud Console.
3. Add `http://localhost:5173` and `http://localhost:5174` as authorized JavaScript origins.
4. Set both `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` in `.env`.
5. Set a strong `JWT_SECRET` in `.env`.
6. Run `npm run dev`.

## Todo

- [x] React App
- [x] Web IDE
- [x] Code executor
- [x] Voice Transcriber
- [ ] Code diff tracker
- [ ] Data processor
- [ ] Leet-code problems
- [ ] Real-time conversation AI
