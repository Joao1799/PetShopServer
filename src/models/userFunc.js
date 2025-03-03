import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const createUserFunc = async (request, response) => {
    try {
        const { email, CPF, senha, name, cargo } = request.body;
        const userExist = await prisma.UserFunc.findFirst({
            where: {
                OR: [
                    { CPF: CPF }, // Verifica se já existe 
                    { email: email }
                ]
            }
        });
        if (userExist) {
            return response.status(422).json({ msg: 'CPF/Email já cadastrados' })
        }

        // Gera o hash da senha (cryptografa)
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(senha, salt); //senha criptografada (senha e paramentro do bcrypt)

        // Cria o usuário com a senha criptografada
        const newUser = await prisma.UserFunc.create({
            data: {
                email,
                CPF,
                senha: passwordHash,
                name,
                cargo
            }
        });

        return response.status(201).json({ msg: "Usuário criado com sucesso!", user: newUser });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Erro ao criar usuário." });
    }
};

const loginUserFunc = async (request, response) => {
    const { email, senha } = request.body

    if (!email) {
        return response.status(422).json({ msg: 'Email é obrigatorio' })
    }
    if (!senha) {
        return response.status(422).json({ msg: 'Senha é obrigatorio' })
    }

    const user = await prisma.UserFunc.findFirst({
        where: {
            OR: [
                { email: email } // Verifica se já existe 
            ]
        }
    });
    if (!user) {
        return response.status(404).json({ msg: 'Usuario nao encontrado' })
    }

    const checkSenha = await bcrypt.compare(senha, user.senha)
    if (!checkSenha) {
        return response.status(422).json({ msg: 'Senha invalida!' })
    }


    try {
        const secret = process.env.SECRET;
        const token = jwt.sign(
            { id: user._id },
            secret,
            { expiresIn: '1h' }   // expirar o token após 1 hora
        );
        return response.status(200).json({ msg: 'Usuário autenticado', token });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Erro ao gerar o token!' });
    }
}

const getUserFuncInfos = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.userFunc.findUnique({
            where: {
                id: id
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado!' });
        }
        const { senha, ...userWithoutPassword } = user;

        return res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar o usuário!' });
    }
};


const getAllUsersFunc = async (request, response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                pets: true,
                atendimentos: true,
            },
        });

        response.status(200).json(users);
        console.log(users);
    } catch (error) {
        response.status(500).json({ error: 'Erro ao buscar usuários' });
    }
};

const updateUserFunc = async (request, response) => {
    try {
        await prisma.user.update({
            where: {
                id: request.params.id
            },
            data: {
                ownerName: request.body.ownerName,
                email: request.body.email,
                atendimento: request.body.atendimento
            }
        })
        response.status(201).json(request.body)
    } catch (error) {
        response.status(500).json({ error: 'Erro ao editar usuário' });
    }
}

const deleteUserFunc = async (request, response) => {
    try {
        await prisma.user.delete({
            where: {
                id: request.params.id
            }
        })
        response.status(204).json(request.body)
    } catch {
        response.status(500).json({ error: 'Erro ao excluir usuário' });
    }
}

export default {
    createUserFunc,
    loginUserFunc,
    getUserFuncInfos,
    // getAllUsersFunc,
    // updateUserFunc,
    // deleteUserFunc,
};
