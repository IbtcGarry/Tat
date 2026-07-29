import './Loader.css';
import walkSheet from '../assets/walk_sheet2.png';
import turnPose from '../assets/harv_pose.png';
import dollarBill from '../assets/dollar_bill.png';
 
type LoaderProps = {
  onComplete?: () => void;
};
 
export default function Loader({ onComplete }: LoaderProps) {
  // moverAnim owns the final "fade to nothing" step, so we key off its name
  // specifically -- child pose layers have their own animations ending at
  // the same 12s mark, and those events bubble up too.
  function handleAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.animationName === 'moverAnim' && onComplete) {
      onComplete();
    }
  }
 
  return (
    <div id="stage">
      <div id="shadow"></div>
      <div id="mover" onAnimationEnd={handleAnimationEnd}>
        <div id="dollar" style={{ backgroundImage: `url(${dollarBill})` }}></div>
        <div id="walkPose" style={{ backgroundImage: `url(${walkSheet})` }}></div>
        <div id="turnPose" style={{ backgroundImage: `url(${turnPose})` }}></div>
      </div>
    </div>
  );
}
 
