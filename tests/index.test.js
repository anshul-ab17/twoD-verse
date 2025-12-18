import {axios} from "axios";

function sum(a,b){
    return a+b
}

const Url ="http://localhost:3000";

describe('Authentication', () => {

    test('User is able to sign up', async()=> {
        const username = "ab"+ Math.random();
        const password = "1234567";
        const response = await axios.post(`${Url}/api/v1/signup`,{
            username,
            password,type:"admin"
        })

        expect((response.statusCode).toBe(200))

        const newResponse = await axios.post(`${Url}/api/v1/user/signup`,{
            username,
            password,type:"admin"
        })
        expect(newResponse.statusCode).toBe(400)
    })

    test('sign up  request fails if username is empty',async()=> {
        const username = "ab"+Math.random()
        const password="1234567";

        const response= await axios.post(`${Url}/api/v1/signup`,{
            password
        })
        expect(response.statusCode).toBe(400)
    })

    test('sign in succed if the username and password are corect',async ()=> {
        const username= "ab"+ Math.random();
        const password= "1234567";
        await axios.post(`${Url}/api/v1/signup`,{
            username,
            password
        });
        const response=await axios.post(`${Url}/api/v1/signin`,{
            username,
            password
        })

        expect(response.statusCode).toBe(200)
        expect(response.body.token).toBeDefined()
    })

    test('sign in fail if wrong credentials', async ()=> {
        const username = "ab"+ Math.random()
        const password = "1234567";

        await axios.post(`${Url}/api/v1/signup`,{
            username,
            password
        })
        const response = await axios.post(`${Url}/api/v1/signin`,{
            username:"Wrong",
            password
        })
        expect(response.statusCode).toBe(403)
    })
})

describe('user authenciation endpoints',() => {
    let token="";
        beforeAll(async ()=> {
        const username = "ab"+ Math.random()
        const password=  "1234567";

        await axios.post(`${Url}/api/v1/signup`,{
            username,
            password,
            type:"admin"
        })
        const response= await axios.post(`${Url}/api/v1/signin`,{
            username,
            password
        })
        token = response.data.token
    })

    test("test1", () => {
        expect(1).toBe(1)
    })

    test("test2", () => {
        expect(2).toBe(2)
    })
})

// 1:18 