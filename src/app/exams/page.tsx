import { redirect } from 'next/navigation';

export default function ExamsLobby() {
  redirect('/dashboard#exams-list');
}
