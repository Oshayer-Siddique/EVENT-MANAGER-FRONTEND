import { Suspense } from 'react';
import Checkout from './Checkout';

const CheckoutPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Checkout />
        </Suspense>
    );
};

export default CheckoutPage;