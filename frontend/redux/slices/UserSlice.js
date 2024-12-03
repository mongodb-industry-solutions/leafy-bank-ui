import { fetchCart, fetchOrders } from "@/lib/api";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


// Thunks to fetch various user data
export const fetchUserData = createAsyncThunk( 'User/fetchUserData',
    async (userId, { dispatch }) => {
      const [orders, cart] = await Promise.all([
        fetchOrders(userId),
        fetchCart(userId)
      ]);
      return { orders, cart };
    }
  );

const initCart = {
    products: [], 
    totalPrice: 0, 
    totalAmount: 0, 
    _id: null, 
    loading: false, 
    error: null
}
const UserSlice = createSlice({
    name: "User",
    initialState: {
        usersList: [],      // [] or [...]
        selectedUser: null, // null or {...}
        loading: true,      // true or false
        error: null,         // null or {msg: ""}
        orders: {
            loading: true,
            error: null,
            list: [],
            initialLoad: false,
            updateToggle: false
        },
        cart: {...initCart, loading: true}
    },
    reducers: {
        setUsersList: (state, action) => {
            return {...state, usersList: [...action.payload]}
        },
        addUsersNewOrder: (state, action) => {
            let newOrders = [action.payload.order, ...state.orders.list]
            return {
                ...state,
                orders: {
                    ...state.orders,
                    updateToggle: !state.orders.updateToggle,
                    list: newOrders
                }
            }
        },
        setSelectedUser: (state, action) => {
            return {...state, selectedUser: {...action.payload}}
        },
        setLoadingUsersList: (state, action) => {
            return {...state, loading: action.payload}
        },
        setErrorUsersList: (state, action) => {
            if(error === null)
                return {...state, error: null}
            else
                return {...state, error: {...action.payload}}
        },
        updateUsersOrder: (state, action) => {
            let newList = [...state.orders.list]
            for (let index = 0; index < newList.length; index++) {
                if (newList[index]._id === action.payload.orderId){
                    newList[index] = {...action.payload.order}
                    break;
                }
            }
            //console.log('newList', newList)
            return {
                ...state, 
                orders: {
                    ...state.orders,
                    updateToggle: !state.orders.updateToggle,
                    list: [...newList]
                }
            }

        },
        setCartProductsList: (state, action) => {
            if(action.payload === null){ 
              // cart is null when the document for this user's cart does not exist on Atlas
              return {
                ...state, 
                cart: {...initCart}
            }
            }else{
              const totalPrice = action.payload.products.reduce((sum, product) => sum + (product.price.amount * product.amount), 0) || 0;
              const totalAmount = action.payload.products.reduce((sum, product) => sum + product.amount, 0) || 0;
              return {
                ...state, 
                cart: {
                    products: [...action.payload.products], 
                    totalPrice, 
                    totalAmount, 
                     _id: action.payload._id, 
                     loading: false, 
                     error: null
                }
              }
            }
        },
        clearCartProductsList: (state, action) => {
            return {
              ...state, 
              cart: {...initCart}
            }
        },
        setCartLoading: (state, action) => {
            return {...state, cart: {...state.cart, loading: action.payload}}
        },
        addCartProduct: (state, action) => {
            return
            // TODO if you wish to use this method first: re calculate totalPrice and totalAmount
            //return {...state, products: [...state.products, action.payload]}            
        },
        removeCartProduct: (state, action) => {
            return
            // TODO  if you wish to use this method first: re calculate totalPrice and totalAmount
            //let newList = state.products.filter(product => product.id !== action.payload.id)
            //return {...state, products: [...newList]}        
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUserData.fulfilled, (state, action) => {
            // Load initial orders
            state.orders.loading = false
            state.orders.list = action.payload.orders;
            state.orders.initialLoad = true
            // Load initial cart
            console.log('AQUI', action.payload.cart)
            if(action.payload.cart === null){
                state.cart = {...initCart}
            }else{
                const totalPrice = action.payload.cart.products.reduce((sum, product) => sum + (product.price.amount * product.amount), 0) || 0;
                const totalAmount = action.payload.cart.products.reduce((sum, product) => sum + product.amount, 0) || 0;
                state.cart = {...action.payload.cart}
                state.cart.loading = false
                state.cart.error = null;
                state.cart.products = [...action.payload.cart.products], 
                state.cart.totalPrice = totalPrice, 
                state.cart.totalAmount = totalAmount
                state.cart._id = action.payload.cart._id
            }
        });
      },
})

export const {
    setUsersList, 
    addUsersNewOrder,
    setSelectedUser, 
    setLoadingUsersList, 
    setErrorUsersList,
    updateUsersOrder,
    setCartProductsList,
    clearCartProductsList,
    setCartLoading
} = UserSlice.actions

export default UserSlice.reducer

/*
 Example of User schema:
    {
    "_id": {
        "$oid": "65a546ae4a8f64e8f88fb89e"
    },
    "name": "Maria",
    "surname": "Torres",
    "type": "customer",
    "email": "maria.torres@gmail.com",
    "address": {
        "street_and_number": "Cuauhtemoc 100",
        "cp": "62240",
        "Country": "Mexico",
        "State": "Morelos",
        "city": "Cuernavaca"
    }
    }
*/