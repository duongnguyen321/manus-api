// random function (from, to) => random number between from and to
export default function rand(from: number, to: number): number {
  return Math.floor(Math.random() * (to - from + 1) + from);
}
