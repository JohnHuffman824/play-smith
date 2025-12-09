import { UserRepository } from '../db/repositories/UserRepository';

const userRepo = new UserRepository();

export const usersAPI = {
	async GET(req: Request) {
		const users = await userRepo.list();
		return Response.json(users);
	},

	async POST(req: Request) {
		const body = await req.json();

		if (!body.email || !body.name) {
			return Response.json(
				{ error: 'email and name are required' },
				{ status: 400 }
			);
		}

		const user = await userRepo.create({
			email: body.email,
			name: body.name,
		});

		return Response.json(user, { status: 201 });
	},
};

export async function getUserById(req: Request) {
	const id = parseInt(req.params.id, 10);
	const user = await userRepo.findById(id);

	if (!user) {
		return Response.json({ error: 'User not found' }, { status: 404 });
	}

	return Response.json(user);
}
