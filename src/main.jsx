import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/500.css";
import "@fontsource/roboto-mono/700.css";
import "./index.css";
import {DevSupport} from '@react-buddy/ide-toolbox';
import {ComponentPreviews, useInitial} from '@/dev/index.js';
document.head.dataset.initialTitle = document.title
ReactDOM.createRoot(document.getElementById("root")).render(
<DevSupport ComponentPreviews={ComponentPreviews}
            useInitialHook={useInitial}
>
<App />
</DevSupport>
);
