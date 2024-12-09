import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox';
import {PaletteTree} from './palette';
import MusicPlayer from '@/components/MusicPlayer.jsx';

const ComponentPreviews = () => {
  return (
  <Previews palette={<PaletteTree />}>
        <ComponentPreview path="/MusicPlayer">
<MusicPlayer />
</ComponentPreview>
</Previews>
  );
};

export default ComponentPreviews;
