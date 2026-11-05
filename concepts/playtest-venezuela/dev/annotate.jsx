// Agentation toolbar for quick design annotations. It is a React component, so it's bundled
// separately from the vanilla prototype (npm run build:annotate) and mounted in its own root.
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

var host = document.createElement('div');
host.id = 'annotate-root';
document.body.appendChild(host);
createRoot(host).render(
  <Agentation endpoint="http://localhost:4747" appName="Source Gatherer playtest" useHashLocation identifyingAttributes={['data-action', 'data-id', 'data-col']} />
);
