import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox';
import {PaletteTree} from './palette';
import MusicPlayer from '@/components/MusicPlayer.jsx';
import TypingIntro from '@/components/TypingIntro.jsx';

const ComponentPreviews = () => {
  return (
  <Previews palette={<PaletteTree />}>
        <ComponentPreview path="/MusicPlayer">
<MusicPlayer />
</ComponentPreview>
<ComponentPreview path="/TypingIntro">
<TypingIntro />
</ComponentPreview>
</Previews>
  );
};

export default ComponentPreviews;
